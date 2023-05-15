<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTemplateActionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('template_actions', function (Blueprint $table) {
            $table->id();
			/*
			list of available actions
			 - create
			 - set
			*/
			$table->string('action');
			/*
			vpc
			network
			vm
			dns
			*/
			$table->string('object');
			
			$table->string('arguments');
			$table->foreignId('template_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			
			
			
			
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('template_actions');
    }
}
